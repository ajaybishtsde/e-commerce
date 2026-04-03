import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from 'src/common/gaurds/jwt.auth.gaurd';
import { RolesGuard } from 'src/common/gaurds/roles.gaurd';
import { Roles } from 'src/common/decorators/role.decorators';
import { Role } from '@prisma/client';
import { CategoryDto } from './dto/create-category.dto';
import { CategoryReponseDto } from './dto/category-response.dto';
import { QueryyCategoryDto } from './dto/queryCategoryDto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('category')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(
    @Body() categoryDto: CategoryDto,
  ): Promise<{ status: boolean; data: CategoryReponseDto }> {
    return await this.categoryService.create(categoryDto);
  }

  @Get('all')
  async findAll(@Query() queryDto: QueryyCategoryDto): Promise<{
    status: boolean;
    data: {
      categories: CategoryReponseDto[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    return await this.categoryService.findAll(queryDto);
  }
}
