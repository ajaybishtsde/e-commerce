import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoryDto } from './dto/create-category.dto';
import { CategoryReponseDto } from './dto/category-response.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Category, Prisma } from '@prisma/client';
import { QueryyCategoryDto } from './dto/queryCategoryDto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prismaService: PrismaService) {}

  async create(
    categoryDto: CategoryDto,
  ): Promise<{ status: boolean; data: CategoryReponseDto }> {
    const { name, slug, ...rest } = categoryDto;

    const categorySlug =
      slug ??
      name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');

    const existingCategory = await this.prismaService.category.findUnique({
      where: {
        slug: categorySlug,
      },
    });
    if (existingCategory) {
      throw new Error(`Category with this slug already exist ${categorySlug}`);
    }
    const category = await this.prismaService.category.create({
      data: {
        name,
        slug: categorySlug,
        ...rest,
      },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        imageUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { status: true, data: this.formatCategory(category, 0) };
  }

  private formatCategory(
    category: Category,
    productCount: number,
  ): CategoryReponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.slug,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      productCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async findAll(queryDto: QueryyCategoryDto): Promise<{
    status: boolean;
    data: {
      categories: CategoryReponseDto[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    const { isActive } = queryDto;

    const limit = Math.min(queryDto.limit ?? 10, 50);
    const page = Math.max(queryDto.page ?? 1, 1);
    const skip = (page - 1) * limit;
    const search = queryDto.search?.trim();

    const where: Prisma.CategoryWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (search) {
      where.OR = [
        {
          name: { contains: search, mode: 'insensitive' },
        },
        {
          description: { contains: search, mode: 'insensitive' },
        },
      ];
    }

    const [total, categories] = await Promise.all([
      this.prismaService.category.count({ where }),
      this.prismaService.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { product: true },
          },
        },
      }),
    ]);

    return {
      status: true,
      data: {
        categories: categories.map((category) =>
          this.formatCategory(category, category._count.product),
        ),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    };
  }

  async findOne(
    id: number,
  ): Promise<{ status: boolean; data: CategoryReponseDto }> {
    const category = await this.prismaService.category.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            product: true,
          },
        },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return {
      status: true,
      data: this.formatCategory(category, category._count.product),
    };
  }

  async findBySlug(
    slug: string,
  ): Promise<{ status: boolean; data: CategoryReponseDto }> {
    const category = await this.prismaService.category.findUnique({
      where: {
        slug,
      },
      include: {
        _count: {
          select: { product: true },
        },
      },
    });
    if (!category) {
      throw new NotFoundException('Category with this slug not found');
    }
    return {
      status: true,
      data: this.formatCategory(category, category._count.product),
    };
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<{ status: boolean; message: string }> {
    const category = await this.prismaService.category.findUnique({
      where: {
        id,
      },
    });
    if (!category) throw new NotFoundException('Category not found');

    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const slugTaken = await this.prismaService.category.findUnique({
        where: {
          slug: updateCategoryDto.slug,
        },
      });
      if (slugTaken)
        throw new ConflictException(
          `This slug ${updateCategoryDto?.slug} is already registerd`,
        );
    }
    await this.prismaService.category.update({
      where: {
        id,
      },
      data: updateCategoryDto,
    });
    return { status: true, message: 'Category updated' };
  }

  async delete(id: number): Promise<{ status: boolean; message: string }> {
    const category = await this.prismaService.category.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: { product: true },
        },
      },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (category._count.product > 0) {
      throw new BadRequestException(
        `Category with ${category._count.product} can not be deleted`,
      );
    }
    await this.prismaService.category.delete({
      where: {
        id,
      },
    });
    return { status: true, message: 'Category deleted successfully' };
  }
}
