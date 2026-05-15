// Bietet im Browser den "Passwort speichern"-Dialog an. Wird gebraucht, weil
// unser Login-Form preventDefault() macht und der Browser sonst keinen
// Save-Prompt zeigt. No-op auf Safari/Firefox und in SSR.
export async function maybeStorePasswordCredential(
  id: string,
  password: string,
  name?: string,
): Promise<void> {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    PasswordCredential?: new (data: {
      id: string;
      password: string;
      name?: string;
    }) => Credential;
  };
  if (!w.PasswordCredential || !("credentials" in navigator)) return;
  try {
    const cred = new w.PasswordCredential({ id, password, name: name ?? id });
    await navigator.credentials.store(cred);
  } catch {
    /* browser declined — ignore */
  }
}
