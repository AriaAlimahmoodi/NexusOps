import type { StandardSchemaWithJSON } from '@modelcontextprotocol/server';
import { z } from 'zod';
export declare function shapeToStandardSchema<Shape extends z.ZodRawShape>(shape: Shape): StandardSchemaWithJSON<z.objectInputType<Shape, z.ZodTypeAny>, z.objectOutputType<Shape, z.ZodTypeAny>>;
