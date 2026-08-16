import { propertyRepo } from "./property.repo";

export const propertyService = {
  create(input: {
    organizationId: string;
    name: string;
    propertyType: string;
    addressLine1: string;
    city: string;
    state: string;
    country: string;
  }) {
    return propertyRepo.create(input);
  },
};
