import { PrismaClient, Prisma } from "@prisma/client";

// 实例化 Prisma Client
const db = new PrismaClient();

// 定义通用CRUD服务
class BaseService<TModelDelegate extends { findMany: Function, findUnique: Function, create: Function, update: Function, upsert: Function, delete: Function, deleteMany: Function }> {
  private model: TModelDelegate;

  constructor(model: TModelDelegate) {
    this.model = model;
  }

  // 查询单个条目
  async findUnique(where: any) {
    return this.model.findUnique({ where });
  }

  // 查询多个条目
  async findMany(params?: any) {
    return this.model.findMany(params);
  }

  // 创建新条目
  async create(data: any) {
    return this.model.create({ data });
  }

  // 更新条目
  async update(where: any, data: any) {
    return this.model.update({
      where,
      data,
    });
  }

  // 删除条目
  async delete(where: any) {
    return this.model.delete({ where });
  }

  // 批量删除
  async deleteMany(where: any) {
    return this.model.deleteMany({ where });
  }

  // 创建或更新条目
  async upsert(where: any, createData: any, updateData: any) {
    return this.model.upsert({
      where,
      create: createData,
      update: updateData,
    });
  }
}

export default BaseService;
