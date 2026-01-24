const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://giihzdpgrariyvtqofzi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpaWh6ZHBncmFyaXl2dHFvZnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNzQyMTgsImV4cCI6MjA4NDg1MDIxOH0.MFcbWgSe7S9p5H-py6PijoDKGtwxJmBYPlo_L0UD9oU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    console.log('Searching for BBB 26 channel...');

    // Find the channel
    const { data: channels, error: channelError } = await supabase
        .from('channels')
        .select('id, name')
        .ilike('name', '%BBB%');

    if (channelError) {
        console.error('Error finding channel:', channelError);
        return;
    }

    if (!channels || channels.length === 0) {
        console.error('No channel found matching BBB');
        return;
    }

    const channel = channels[0];
    console.log(`Found channel: ${channel.name} (${channel.id})`);

    // Update the stream source
    const newStreamUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

    console.log(`Updating stream sources for channel ${channel.id} to use: ${newStreamUrl}`);

    // First, verify we can find the sources
    const { data: sources, error: sourceError } = await supabase
        .from('stream_sources')
        .select('id, stream_url')
        .eq('channel_id', channel.id);

    if (sourceError) {
        console.error('Error fetching sources:', sourceError);
        // Proceeding to try update anyway, or insert?
    }

    console.log('Current sources:', sources);

    // Update all sources for this channel to the working URL (for testing)
    const { data: updated, error: updateError } = await supabase
        .from('stream_sources')
        .update({ url: newStreamUrl, type: 'hls' })
        .eq('channel_id', channel.id)
        .select();

    if (updateError) {
        console.error('Error updating sources:', updateError);
        console.log('NOTE: If this fails with 401/403, RLS policies prevent anonymous updates. You verify this.');
    } else {
        console.log('Successfully updated sources:', updated);
    }
}

run();
