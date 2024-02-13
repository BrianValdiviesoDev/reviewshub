import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Company, CompanyDocument } from './entity/company.schema';
import { Model, Types } from 'mongoose';
import { JwtDto } from 'src/auth/dto/jwt.dto';
import { UserRole } from 'src/users/entity/users.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<CompanyDocument> {
    return await this.companyModel.create(createCompanyDto);
  }

  async findAll(): Promise<CompanyDocument[]> {
    return await this.companyModel.find();
  }

  async findOne(id: string, token: JwtDto): Promise<CompanyDocument> {
    if (token.rol !== UserRole.SUPERADMIN && token.company !== id) {
      throw new ForbiddenException(
        "You don't have permission to read this company",
      );
    }

    const company = await this.companyModel.findById(id);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    token: JwtDto,
  ): Promise<CompanyDocument> {
    if (token.rol !== UserRole.SUPERADMIN && token.company !== id) {
      throw new ForbiddenException(
        "You don't have permission to update this user",
      );
    }

    const update: UpdateCompanyDto = {
      name: updateCompanyDto.name,
    };

    const company = await this.companyModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      {
        $set: update,
      },
      { new: true },
    );

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async remove(id: string): Promise<void> {
    const company = await this.companyModel.findById(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.companyModel.deleteOne({ _id: new Types.ObjectId(id) });
  }
}
