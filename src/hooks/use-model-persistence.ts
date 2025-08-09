import { useModel } from "@/contexts/use-model/model-hooks";

export const useModelPersistence = () => {
  const { currentModel } = useModel();
  return currentModel;
};
