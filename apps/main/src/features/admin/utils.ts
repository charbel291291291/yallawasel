import { supabase } from "@/services/supabaseClient";

/**
 * Uploads an image to Supabase Storage and returns the public URL.
 * @param file The file to upload.
 * @returns A promise that resolves to the public URL of the uploaded image.
 */
export const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(fileName);
    return data.publicUrl;
};
