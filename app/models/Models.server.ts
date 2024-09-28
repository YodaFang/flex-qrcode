import { Prisma } from "@prisma/client";
import type { Profile } from "@prisma/client";
export type { Profile }  from "@prisma/client";
import db from "~/db.server";
import { singleton } from "~/utils/singleton.server";
import { getModelFields, getDefaultFieldValue } from "~/models/utils";

const modelName = 'profile';
export type ModelData = Prisma.ProfileCreateInput & { id?: number };


const model = db[modelName];
const fields = singleton(`${modelName}_fields`, () => getModelFields(modelName));

export function newModel(){
  const m: Record<string, any>  = {};
  if (fields) {
    fields.forEach((f) => {
      if(f.isId || f.isUpdatedAt || f.isReadOnly) return;
      m[f.name] = f.hasDefaultValue ? null : getDefaultFieldValue(f.type);
    });
  }
  return m;
}

function find(id: number){
    return model.findUnique({ where: { id } });
}

export default {
    modelName: modelName,
    newModel: newModel,
    find: find,
    create: model.create,
    update: model.update,
    delete: model.delete,
};

