import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { MockProperty } from "@/features/properties/lib/mock-data";

const CREATED_PROPERTIES_KEY = ["properties", "created"] as const;

/**
 * Session-only store for properties created via the dialog. No backend
 * create-property endpoint exists yet, so newly created properties are kept
 * in the query cache (shared across the app shell and /properties page)
 * until a real mutation replaces this.
 */
export function useCreatedProperties() {
  const queryClient = useQueryClient();
  const { data } = useQuery<MockProperty[]>({
    queryKey: CREATED_PROPERTIES_KEY,
    queryFn: () => [],
    staleTime: Number.POSITIVE_INFINITY,
    initialData: [],
  });

  function addCreatedProperty(property: MockProperty) {
    queryClient.setQueryData<MockProperty[]>(CREATED_PROPERTIES_KEY, (prev) => [
      ...(prev ?? []),
      property,
    ]);
  }

  return { createdProperties: data ?? [], addCreatedProperty };
}

export function useCreatePropertyAndNavigate() {
  const navigate = useNavigate();
  const { addCreatedProperty } = useCreatedProperties();

  return function createPropertyAndNavigate(name: string) {
    const id = `new-${Date.now()}`;
    addCreatedProperty({
      id,
      name,
      propertyType: "villa",
      city: "",
      status: "active",
    });
    navigate({ to: "/properties/$propertyId", params: { propertyId: id } });
  };
}
