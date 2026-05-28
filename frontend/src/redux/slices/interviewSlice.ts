import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { interviewAPI } from "../../services/api";

interface Interview {
  id: string;
  title: string;
  description?: string;
  status: string;
  scheduledAt: string;
  duration: number;
  meetingId: string;
  candidate?: any;
  recruiter?: any;
  company?: any;
}

interface InterviewState {
  interviews: Interview[];
  currentInterview: Interview | null;
  analytics: any;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const initialState: InterviewState = {
  interviews: [],
  currentInterview: null,
  analytics: null,
  isLoading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
};

export const fetchRecruiterInterviews = createAsyncThunk(
  "interview/fetchRecruiter",
  async (
    { page, limit }: { page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await interviewAPI.getRecruiterInterviews(page, limit);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch interviews",
      );
    }
  },
);

export const fetchCandidateInterviews = createAsyncThunk(
  "interview/fetchCandidate",
  async (
    { page, limit }: { page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await interviewAPI.getCandidateInterviews(page, limit);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch interviews",
      );
    }
  },
);

export const createInterview = createAsyncThunk(
  "interview/create",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await interviewAPI.create(data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create interview",
      );
    }
  },
);

const interviewSlice = createSlice({
  name: "interview",
  initialState,
  reducers: {
    setCurrentInterview: (state, action: PayloadAction<Interview | null>) => {
      state.currentInterview = action.payload;
    },
    clearInterviewError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecruiterInterviews.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchRecruiterInterviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.interviews = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchRecruiterInterviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCandidateInterviews.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCandidateInterviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.interviews = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCandidateInterviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createInterview.fulfilled, (state, action) => {
        state.interviews.unshift(action.payload);
      });
  },
});

export const { setCurrentInterview, clearInterviewError } =
  interviewSlice.actions;
export default interviewSlice.reducer;
