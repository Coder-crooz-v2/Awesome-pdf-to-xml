import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    type: {
        type: String,
        required: true
    },
    url: {
      type: String,
      required: true,
    }
  },
  { timestamps: true }
);

export const Document = mongoose.model("Document", documentSchema);