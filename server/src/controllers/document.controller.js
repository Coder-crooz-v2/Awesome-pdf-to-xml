import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Document } from "../models/document.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

// Upload a PDF file
const uploadDocument = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "PDF file is required");
    }

    const pdfLocalPath = req.file.path;
    // Validate PDF file
    if (!req.file.mimetype || !(req.file.mimetype.includes('pdf') || req.file.mimetype.includes('xml'))) {
        // Clean up the invalid file
        throw new ApiError(400, "Only PDF or XML files are allowed");
    }

    try {
        // Upload PDF to Cloudinary
        const uploadedFile = await uploadOnCloudinary(pdfLocalPath);

        if (!uploadedFile) {
            throw new ApiError(500, "Error uploading PDF to cloudinary");
        }

        // Create a new document in database
        const document = await Document.create({
            owner: req.user._id,
            originalName: req.file.originalname,
            type: req.file.mimetype.includes('pdf') ? 'pdf' : 'xml',
            url: uploadedFile.secure_url
        });
        return res.status(201).json(
            new ApiResponse(201, document, "File uploaded successfully")
        );
    } catch (error) {
        throw new ApiError(500, `Error uploading file: ${error.message}`);
    }
});

// // Get all documents for the current user
const getUserDocuments = asyncHandler(async (req, res) => {
    try {
        const documents = await Document.find({ owner: req.user._id });
    
        if (!documents || documents.length === 0) {
            return res.status(404).json(
                new ApiResponse(404, [], "No documents found for the current user")
            );
        }
    
        return res.status(200).json(
            new ApiResponse(200, documents, "Documents retrieved successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Error fetching documents: ", error)
    }
});

// // Delete a document
const deleteDocument = asyncHandler(async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
    
        if (!document) {
            throw new ApiError(404, "Document not found");
        }
    
        // Check if the document belongs to the current user
        if (document.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You don't have permission to delete this document");
        }
    
        // TODO: Delete files from cloudinary
        const publicId = document.url.split("/").pop().split(".")[0];
        if (document.type === 'pdf') {
            await cloudinary.uploader.destroy(publicId, (error, result) => {
                if (error) {
                    console.error("Error deleting PDF from Cloudinary:", error);
                    throw new ApiError(500, "Error deleting PDF from Cloudinary");
                }
            });
        } else if (document.type === 'xml') {
            await cloudinary.uploader.destroy(publicId+".xml", {resource_type: 'raw'}, (error, result) => {
                if (error) {
                    console.error("Error deleting XML from Cloudinary:", error);
                    throw new ApiError(500, "Error deleting XML from Cloudinary");
                } else {
                    console.log("XML deleted from Cloudinary:", result);
                }
            });
        } else {
            throw new ApiError(400, "Invalid document type for deletion");
        }

        await Document.findByIdAndDelete(req.params.id);
    
        return res.status(200).json(
            new ApiResponse(200, {}, "Document deleted successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Error deleting document: ", error)
    }
});


export {
    uploadDocument,
    getUserDocuments,
    deleteDocument
};