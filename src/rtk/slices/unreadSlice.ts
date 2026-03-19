import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UnreadMap {
  [key: string]: number; // `${buyerId}_${batchId}`
}

interface UnreadState {
  map: UnreadMap;          
  bidAcceptedCount: number; 
}

const initialState: UnreadState = {
  map: {},
  bidAcceptedCount: 0,
};

const unreadSlice = createSlice({
  name: "unread",
  initialState,
  reducers: {
    // existing reducers (UNCHANGED behavior)
    setUnread: (
      state,
      action: PayloadAction<{ key: string; count: number }>
    ) => {
      state.map[action.payload.key] = action.payload.count;
    },

    setUnreadMap: (state, action: PayloadAction<UnreadMap>) => {
      state.map = action.payload;
    },

    incrementUnread: (state, action: PayloadAction<{ key: string }>) => {
      state.map[action.payload.key] =
        (state.map[action.payload.key] || 0) + 1;
    },

    resetUnread: (state, action: PayloadAction<{ key: string }>) => {
      state.map[action.payload.key] = 0;
    },

    // NEW reducer (SAFE, isolated)
    setBidAcceptedCount: (state, action: PayloadAction<number>) => {
      state.bidAcceptedCount = action.payload;
    },
  },
});

export const {
  setUnread,
  setUnreadMap,
  incrementUnread,
  resetUnread,
  setBidAcceptedCount, 
} = unreadSlice.actions;

export default unreadSlice.reducer;
