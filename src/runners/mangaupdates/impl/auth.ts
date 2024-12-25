import {
  BasicAuthenticatable,
  BasicAuthenticationUIIdentifier,
} from "@suwatte/daisuke";
// import { getUser } from "../api/auth";
// import { KomgaStore } from "../store";
// import { genURL } from "../utils";
import { AUTHENTICATED_CLIENT } from "../api/auth";

export const MUAuthentication: BasicAuthenticatable = {
  BasicAuthUIIdentifier: BasicAuthenticationUIIdentifier.USERNAME,
  getAuthenticatedUser: async () => {
    const authenticated = await ObjectStore.get("authenticated");
    if (!authenticated) return null;

    try {
      const response = await new NetworkClient().request({
        url: "https://api.mangaupdates.com/v1/account/profile",
        headers: {
          'Authorization': `Bearer ${await SecureStore.string("jwt")}`,
          'Content-type': 'application/json',
        }
      });
      const profile = JSON.parse(response.data);
      return {
        handle: String(profile.user_id),
        displayName: profile.username,
        avatar: profile.avatar.url,
      };
    } catch (err: any) {
      console.error(err.message);
      await SecureStore.remove("jwt");
      await ObjectStore.remove("authenticated");
    }

    return null;
  },
  handleUserSignOut: async () => {
    throw "Not ready";
  },
  handleBasicAuth: async (identifier, password) => {
    const client = new NetworkClient();
    try {
      const response = await client.request({
        url: "https://api.mangaupdates.com/v1/account/login",
        method: "PUT",
        headers: {
          'Content-type': 'application/json',
        },
        body: {
          "username": identifier,
          "password": password,
        }
      });
      await ObjectStore.set("authenticated", true);
      await SecureStore.set("jwt", JSON.parse(response.data).context.session_token);
    } catch (err) {
      throw err;
    }
  },
};
