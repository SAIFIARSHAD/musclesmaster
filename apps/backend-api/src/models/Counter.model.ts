import { Schema, model, InferSchemaType } from 'mongoose';

const counterSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },

    sequence: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type ICounter = InferSchemaType<typeof counterSchema>;

export const Counter = model<ICounter>('Counter', counterSchema);
