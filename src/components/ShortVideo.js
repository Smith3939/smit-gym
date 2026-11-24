import React from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';
export default function ShortVideo({ uri }) {
  const player = useVideoPlayer(uri, p => { p.loop = true; });
  return <VideoView player={player} nativeControls contentFit="contain" style={{width:'100%',aspectRatio:9/16,maxHeight:560,backgroundColor:'#111',borderRadius:12}} />;
}
