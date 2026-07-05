import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactService, CreateContactInput, UpdateContactInput } from '@services/contact.service';

const CONTACTS_KEY = ['emergency-contacts'];

export function useContacts() {
  return useQuery({
    queryKey: CONTACTS_KEY,
    queryFn: async () => {
      const { contacts, error } = await contactService.list();
      if (error) throw new Error(error);
      return contacts;
    },
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      const { contact, error } = await contactService.create(input);
      if (error) throw new Error(error);
      return contact;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CONTACTS_KEY }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateContactInput }) => {
      const { contact, error } = await contactService.update(id, updates);
      if (error) throw new Error(error);
      return contact;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CONTACTS_KEY }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await contactService.delete(id);
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CONTACTS_KEY }),
  });
}