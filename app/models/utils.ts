import { Prisma } from "@prisma/client";

const defaultValues: Record<string, any> = {
  string: '',
  number: 0,
  boolean: false,
  date: new Date(),
};

export function getDefaultFieldValue(type: string) {
  return defaultValues[type] || null;
}

export function getModelFields(modelName: String){ 
  modelName = modelName.toLowerCase();
  return Prisma.dmmf.datamodel.models.find(
    (model) => model.name.toLowerCase() === modelName
  )?.fields || [];
}
