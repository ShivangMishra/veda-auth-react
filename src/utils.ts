export const hasAuthParams = (): boolean => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code');
}
