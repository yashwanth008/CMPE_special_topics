"""A scripted 'model'. Replies come from a queue, so demos are offline and repeatable.

To go live, replace ScriptedLLM.next() with a real API call: everything after it
(parsing, validation, rendering) is unchanged. That boundary is the point of the course.
"""
import json

class ScriptedLLM:
    def __init__(self, replies):
        self.replies = list(replies)
        self.calls = 0

    def next(self, prompt=""):
        self.calls += 1
        r = self.replies.pop(0)
        return r if isinstance(r, str) else json.dumps(r)

    @staticmethod
    def stream(text, size=40):
        """Yield a reply in chunks, the way a real model streams tokens."""
        for i in range(0, len(text), size):
            yield text[i:i + size]
