import pytest
from app.auth_utils import hash_password, verify_password, create_token, decode_token


class TestPasswordHashing:
    def test_hash_password_uses_bcrypt(self):
        hashed = hash_password("mypassword123")
        assert hashed.startswith("$2b$") or hashed.startswith("$2a$")

    def test_verify_password_correct(self):
        hashed = hash_password("mypassword123")
        assert verify_password("mypassword123", hashed) is True

    def test_verify_password_incorrect(self):
        hashed = hash_password("mypassword123")
        assert verify_password("wrongpassword", hashed) is False

    def test_same_password_different_hashes(self):
        h1 = hash_password("testpass")
        h2 = hash_password("testpass")
        assert h1 != h2


class TestToken:
    def test_create_and_decode_token(self):
        user_id = "test-user-id-123"
        token = create_token(user_id)
        decoded = decode_token(token)
        assert decoded == user_id

    def test_invalid_token_raises(self):
        with pytest.raises(ValueError, match="Invalid token"):
            decode_token("invalid-token")

    def test_tampered_token_raises(self):
        token = create_token("user-1")
        parts = token.split(":")
        tampered = f"{parts[0]}:{parts[1]}:tampered"
        with pytest.raises(ValueError, match="Invalid signature"):
            decode_token(tampered)
