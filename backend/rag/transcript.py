from youtube_transcript_api import YouTubeTranscriptApi

def get_transcript(video_id: str, languages: list = ["en"]) -> str:
    api = YouTubeTranscriptApi()
    transcript_list = api.fetch(video_id=video_id, languages=languages)
    text = " ".join(chunk.text for chunk in transcript_list)
    return text