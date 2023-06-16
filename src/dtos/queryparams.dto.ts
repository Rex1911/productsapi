import { IsMongoId, IsOptional } from 'class-validator';

export class ParamsOnlyId {
  @IsMongoId()
  id: string;
}

export class ParamsPidVid {
  @IsMongoId()
  pid: string;

  @IsMongoId()
  vid: string;
}

export class QueryDto {
  product_name?: string;
  description?: string;
  variant_name?: string;
}
