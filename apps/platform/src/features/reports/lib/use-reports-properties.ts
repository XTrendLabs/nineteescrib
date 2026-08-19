import { useMemo } from "react";

import { useCachedActiveOrganization } from "@/features/auth/api/use-cached-organizations";
import { useProperties } from "@/features/properties/api/use-properties";
import { resolveReportsProperties } from "./mock-data";

export function useReportsProperties() {
  const { data: activeOrganization } = useCachedActiveOrganization();
  const { data: propertiesResponse } = useProperties(activeOrganization?.id);

  return useMemo(
    () => resolveReportsProperties(propertiesResponse?.data),
    [propertiesResponse?.data],
  );
}
