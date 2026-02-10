import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilterSupportDto } from './dto/filter-support.dto';
import { AnswerSupportDto } from './dto/answer-support.dto';

@Controller('supports')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  create(@Body() createSupportDto: CreateSupportDto) {
    return this.supportService.create(createSupportDto);
  }

  @Get()
  findAll(@Query() filters: FilterSupportDto) {
    return this.supportService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supportService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSupportDto: UpdateSupportDto) {
    return this.supportService.update(id, updateSupportDto);
  }

  @Post(':id/answer')
  answer(
    @Param('id') id: string,
    @Body() answerDto: AnswerSupportDto,
    @Request() req: any,
  ) {
    return this.supportService.answer(id, answerDto, req.user.id);
  }

  @Post('sync/:storeId')
  syncFromMarketplace(@Param('storeId') storeId: string, @Body() _data?: any) {
    console.log(`\n📡 [SYNC] Requisição de sincronização recebida para loja: ${storeId}`);
    return this.supportService.syncFromMarketplace(storeId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supportService.remove(id);
  }
}
