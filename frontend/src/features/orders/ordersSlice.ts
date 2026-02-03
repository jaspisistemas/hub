import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface Order {
  id: string;
  marketplace: string;
  status: string;
  total: number;
}

export const fetchOrders = createAsyncThunk('orders/fetch', async () => {
  // TODO: chamar API do backend
  return [] as Order[];
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState: { items: [] as Order[], status: 'idle' as string },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchOrders.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(fetchOrders.fulfilled, (state, action) => {
      state.status = 'success';
      state.items = action.payload;
    });
    builder.addCase(fetchOrders.rejected, (state) => {
      state.status = 'error';
    });
  },
});

export default ordersSlice.reducer;
