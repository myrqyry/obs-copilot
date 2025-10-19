class OBSClient:
    """A tiny OBS client stub used during tests to avoid importing the full client."""
    def __init__(self, host='127.0.0.1', port=4444):
        self.host = host
        self.port = port

    def switch_scene(self, scene_name: str) -> bool:
        # Simulate switching scene
        return True
