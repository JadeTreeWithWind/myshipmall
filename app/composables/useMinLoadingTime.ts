export const useMinLoadingTime = () => {
  const minLoadingTime = async <T>(
    promise: Promise<T> | PromiseLike<T>,
    minTime = 300,
  ): Promise<T> => {
    const [result] = await Promise.all([
      promise,
      new Promise((resolve) => setTimeout(resolve, minTime)),
    ]);
    return result as T;
  };
  return { minLoadingTime };
};
