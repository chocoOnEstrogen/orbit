import { supabase } from '@/configs/supabase'

export async function getGlobalBlacklist(): Promise<string[]> {
	const { data, error } = await supabase.from('global_blacklist').select('tag')

	if (error) {
		console.error('Error fetching global blacklist:', error)
		return []
	}

	return data.map((item) => `-${item.tag}`)
}

export async function getUserBlacklist(userId: string): Promise<string[]> {
	const { data, error } = await supabase
		.from('user_blacklists')
		.select('blacklisted_tags')
		.eq('user_id', userId)
		.single()

	if (error) {
		console.error('Error fetching user blacklist:', error)
		return []
	}

	return (
		data?.blacklisted_tags?.map((tag: string) =>
			tag.startsWith('-') ? tag : `-${tag}`,
		) || []
	)
}

export async function addToBlacklist(
	userId: string,
	tags: string[],
): Promise<boolean> {
	const { error } = await supabase.from('user_blacklists').upsert(
		{
			user_id: userId,
			blacklisted_tags: tags,
		},
		{
			onConflict: 'user_id',
		},
	)

	if (error) {
		console.error('Error updating blacklist:', error)
		return false
	}

	return true
}

export async function addToHistory(
	userId: string,
	site: string,
	tags: string[],
	postUrl: string,
) {
	const { error } = await supabase.from('booru_history').insert({
		user_id: userId,
		site,
		tags,
		post_url: postUrl,
	})

	if (error) {
		console.error('Error adding to history:', error)
	}
}
