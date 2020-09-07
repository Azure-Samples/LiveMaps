import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { History } from 'history';

import { AppThunk, RootState } from '../store/store';

type ClaimsData = { typ: string, val: string }[];

const NAME_CLAIM = "name";
const EMAIL_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";

const USER_INFO_URL = `${process.env.PUBLIC_URL}/.auth/me`;
const USER_LOGOUT_URL = `${process.env.PUBLIC_URL}/.auth/logout?post_logout_redirect_uri=${process.env.PUBLIC_URL}/`;

interface UserState {
  name?: string,
  email?: string,
}

const initialState: UserState = {};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<ClaimsData>) => {
      action.payload.forEach(claim => {
        if (claim.typ === NAME_CLAIM) {
          state.name = claim.val;
        }

        if (claim.typ === EMAIL_CLAIM) {
          state.email = claim.val;
        }
      });
    },
  },
});

let fetchUserData = async () => {
  try {
    const resp = await fetch(USER_INFO_URL);
    const raw_data = await resp.json();
    return raw_data[0];
  } catch (err) {
    console.error("Failed to get current user info");
    return {}
  }
}

if (window.location.hostname === 'localhost') {
  fetchUserData = () => new Promise(resolve => {
    setTimeout(() => resolve({
      "user_claims": [
        {
          "typ": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
          "val": "user@localhost"
        },
        {
          "typ": "name",
          "val": "Example"
        }
      ],
      "user_id": "user@localhost"
    }), 1000)
  })
}

export const fetchUserInfo = (): AppThunk => async dispatch => {
  const data = await fetchUserData();
  return dispatch(userSlice.actions.setUser(data.user_claims));
};

export const logout = (history: History): AppThunk => () => {
  history.push(USER_LOGOUT_URL);
};

export const selectUserName = (state: RootState) => state.user.name;
export const selectUserEmail = (state: RootState) => state.user.email;

export default userSlice.reducer;
