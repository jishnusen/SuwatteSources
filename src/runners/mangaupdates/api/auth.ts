import { NetworkClientBuilder } from "@suwatte/daisuke";

export async function authenticated() {
  return await ObjectStore.boolean("authenticated");
}

export const AUTHENTICATED_CLIENT = new NetworkClientBuilder()
  .addRequestInterceptor(async (req) => {
    const token = await SecureStore.string("jwt");
    req.headers = {
      ...(req.headers || {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    return req;
  })
  .build();

