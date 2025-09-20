// js/services/dataService.js
import { db } from '../supabaseClient.js';

// --- Posts ---
export async function getPosts() {
    const { data, error } = await db
        .from('posts')
        .select(`
            *,
            profiles ( first_name, last_name ),
            comments ( *, profiles ( first_name, last_name ) )
        `)
        .order('created_at', { ascending: false });

    if (error) console.error("Erreur getPosts:", error);
    return data || [];
}

export async function searchPosts(keyword) {
    const { data, error } = await db
        .from('posts')
        .select(`*, profiles ( first_name, last_name )`)
        .textSearch('content', `'${keyword}'`)
        .order('created_at', { ascending: false });
        
    if (error) console.error("Erreur searchPosts:", error);
    return data || [];
}

export async function addPost(userId, content, title) {
    const { data, error } = await db
        .from('posts')
        .insert([{ user_id: userId, content: content, title: title }])
        .select();

    if (error) console.error("Erreur addPost:", error);
    return data;
}

// --- Comments ---
export async function addComment(postId, userId, content) {
    const { data, error } = await db
        .from('comments')
        .insert([{ post_id: postId, user_id: userId, content: content }])
        .select();
    
    if (error) console.error("Erreur addComment:", error);
    return data;
}


// --- Users (for Admin) ---
export async function getUsers() {
    const { data, error } = await db
        .from('profiles')
        .select('*');
        
    if (error) console.error("Erreur getUsers:", error);
    return data || [];
}

export async function searchUsers(keyword) {
    const { data, error } = await db
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${keyword}%,last_name.ilike.%${keyword}%`);

    if (error) console.error("Erreur searchUsers:", error);
    return data || [];
}
