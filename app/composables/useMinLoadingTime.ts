/**
 * 確保最小 loading 時間，避免閃爍
 * @param {Promise} promise - 要執行的異步操作
 * @param {Number} minTime - 最小顯示時間（毫秒），預設 300
 * @returns {Promise} 執行結果
 */
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
