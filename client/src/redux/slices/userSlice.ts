import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { axiosInstance } from '@/lib/axios';



export interface ConversionHistoryItem {
  pdfName: string;
  xmlName: string;
  date: string;
  success: boolean;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  username: string;
  avatar?: string;
  history: ConversionHistoryItem[];
}

interface UserState {
  user: User | null;
  history: ConversionHistoryItem[];
  loading: boolean;
  error: string | null;
}


export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<{ data: any }>(`/users/current-user`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (userData: FormData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch<{ data: any }>(`/users/update-account`, userData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const updateConversionHistory = createAsyncThunk(
  'user/updateConversionHistory',
  async (history: ConversionHistoryItem, { rejectWithValue }) => {
    try {
      console.log('Updating conversion history:', history);
      const response = await axiosInstance.patch<{ data: any }>(
        `/users/update-history`,
        { history: history }
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update conversion history');
    }
  }
);


const initialState: UserState = {
  user: null,
  history: [],
  loading: false,
  error: null,
};


const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    
    addToHistory: (state, action: PayloadAction<ConversionHistoryItem>) => {
      state.history.unshift(action.payload); 

      
      if (state.user) {
        state.user.history = state.history;
      }
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.history = action.payload.history || [];
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.history = action.payload.history || [];
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    
    builder
      .addCase(updateConversionHistory.fulfilled, (state, action: PayloadAction<ConversionHistoryItem[]>) => {
        state.history = action.payload;

        
        if (state.user) {
          state.user.history = action.payload;
        }
      });
  },
});

export const { clearUserError, addToHistory, setUser } = userSlice.actions;
export default userSlice.reducer;