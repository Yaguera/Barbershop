'use server';

import { auth } from '@/auth';

export async function uploadProfileImageAction(formData: FormData): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: 'Nenhum arquivo válido enviado.' };
    }

    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'O arquivo deve ser uma imagem (JPG, PNG, WEBP).' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'A imagem deve ter no máximo 5MB.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if Supabase Storage credentials exist
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `user-${session.user.id}-${Date.now()}.${ext}`;
        const uploadUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/avatars/${fileName}`;

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': file.type,
            'x-upsert': 'true',
          },
          body: buffer,
        });

        if (response.ok) {
          const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/avatars/${fileName}`;
          return { success: true, imageUrl: publicUrl };
        } else {
          console.warn('Falha ao enviar para o Supabase Storage. Usando fallback Base64...');
        }
      } catch (e) {
        console.warn('Erro de rede ao conectar com Supabase Storage:', e);
      }
    }

    // Fallback: Convert to Base64 Data URL so it saves right in database if Supabase Storage bucket isn't set up yet
    const base64Str = `data:${file.type};base64,${buffer.toString('base64')}`;
    return { success: true, imageUrl: base64Str };
  } catch (error: unknown) {
    console.error('Error uploading profile image action:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao realizar upload da imagem.' };
  }
}

export async function uploadServiceImageAction(formData: FormData): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Apenas administradores podem enviar fotos de serviços.' };
    }

    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: 'Nenhum arquivo válido enviado.' };
    }

    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'O arquivo deve ser uma imagem (JPG, PNG, WEBP).' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'A imagem deve ter no máximo 5MB.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if Supabase Storage credentials exist
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `service-${Date.now()}.${ext}`;
        const uploadUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/services/${fileName}`;

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': file.type,
            'x-upsert': 'true',
          },
          body: buffer,
        });

        if (response.ok) {
          const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/services/${fileName}`;
          return { success: true, imageUrl: publicUrl };
        } else {
          console.warn('Falha ao enviar para o Supabase Storage. Usando fallback Base64...');
        }
      } catch (e) {
        console.warn('Erro de rede ao conectar com Supabase Storage:', e);
      }
    }

    const base64Str = `data:${file.type};base64,${buffer.toString('base64')}`;
    return { success: true, imageUrl: base64Str };
  } catch (error: unknown) {
    console.error('Error uploading service image action:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao realizar upload da imagem do serviço.' };
  }
}
