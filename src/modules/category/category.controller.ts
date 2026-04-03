import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from 'src/common/gaurds/jwt.auth.gaurd';
import { RolesGuard } from 'src/common/gaurds/roles.gaurd';
import { Roles } from 'src/common/decorators/role.decorators';
import { Role } from '@prisma/client';
import { CategoryDto } from './dto/create-category.dto';
import { CategoryReponseDto } from './dto/category-response.dto';
import { QueryyCategoryDto } from './dto/queryCategoryDto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('category')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(
    @Body() categoryDto: CategoryDto,
  ): Promise<{ status: boolean; data: CategoryReponseDto }> {
    return this.categoryService.create(categoryDto);
  }

  @Get('all')
  async findAll(@Query() queryDto: QueryyCategoryDto): Promise<{
    status: boolean;
    data: {
      categories: CategoryReponseDto[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    return this.categoryService.findAll(queryDto);
  }

  @Get(':id')
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ status: boolean; data: CategoryReponseDto }> {
    return this.categoryService.findOne(id);
  }

  @Get('slug/:slug')
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<{ status: boolean; data: CategoryReponseDto }> {
    return this.categoryService.findBySlug(slug);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<{ status: boolean; message: string }> {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ status: boolean; message: string }> {
    return this.categoryService.delete(id);
  }
}
