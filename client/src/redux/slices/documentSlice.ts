import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { axiosInstance } from '@/lib/axios';
// Types
export interface Document {
  _id: string;
  originalName: string;
  type: 'pdf' | 'xml';
  url: string;
  owner: string;
  createdAt: string;
}

interface DocumentState {
  documents: Document[];
  loading: boolean;
  error: string | null;
}

// Async Thunks
export const fetchUserDocuments = createAsyncThunk(
  'documents/fetchUserDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/documents`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch documents');
    }
  }
);

export const uploadDocument = createAsyncThunk(
  'documents/uploadDocument',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/documents/upload`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload document');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async (documentId: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/documents/${documentId}`, {
        withCredentials: true,
      });
      return documentId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete document');
    }
  }
);

export const convertPdfToXml = createAsyncThunk(
  'documents/convertPdfToXml',
  async (documentId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/documents/convert/${documentId}`,
        {},
        { withCredentials: true }
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to convert document');
    }
  }
);

// Initial state
const initialState: DocumentState = {
  documents: [],
  loading: false,
  error: null,
};

// Slice
const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    clearDocumentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch documents
    builder
      .addCase(fetchUserDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserDocuments.fulfilled, (state, action: PayloadAction<Document[]>) => {
        state.loading = false;
        state.documents = action.payload;
      })
      .addCase(fetchUserDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Upload document
    builder
      .addCase(uploadDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        state.loading = false;
        state.documents.push(action.payload);
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete document
    builder
      .addCase(deleteDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.documents = state.documents.filter((doc) => doc._id !== action.payload);
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Convert PDF to XML
    builder
      .addCase(convertPdfToXml.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(convertPdfToXml.fulfilled, (state, action: PayloadAction<Document>) => {
        state.loading = false;
        state.documents.push(action.payload);
      })
      .addCase(convertPdfToXml.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDocumentError } = documentSlice.actions;
export default documentSlice.reducer;