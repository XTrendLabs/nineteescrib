import { useMemo } from "react";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { useProperties } from "@/features/properties/api/use-properties";
import { resolveReportsProperties } from "./mock-data";

export function useReportsProperties() {
  const { activeScopeId } = useActiveHq();
  const { data: propertiesResponse } = useProperties(activeScopeId);

  return useMemo(
    () => resolveReportsProperties(propertiesResponse?.data),
    [propertiesResponse?.data],
  );
}
