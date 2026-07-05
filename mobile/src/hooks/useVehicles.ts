import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService, CreateVehicleInput, UpdateVehicleInput } from '@services/vehicle.service';

const VEHICLES_KEY = ['vehicles'];

export function useVehicles() {
  return useQuery({
    queryKey: VEHICLES_KEY,
    queryFn: async () => {
      const { vehicles, error } = await vehicleService.list();
      if (error) throw new Error(error);
      return vehicles;
    },
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateVehicleInput) => {
      const { vehicle, error } = await vehicleService.create(input);
      if (error) throw new Error(error);
      return vehicle;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: VEHICLES_KEY }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateVehicleInput }) => {
      const { vehicle, error } = await vehicleService.update(id, updates);
      if (error) throw new Error(error);
      return vehicle;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: VEHICLES_KEY }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await vehicleService.delete(id);
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: VEHICLES_KEY }),
  });
}

export function useSetPrimaryVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await vehicleService.setPrimary(id);
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: VEHICLES_KEY }),
  });
}