from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse
import re
import logging

logger = logging.getLogger(__name__)

class ValidationError(Exception):
    """Configuration validation error."""
    pass

class ConfigValidator:
    @staticmethod
    def validate_api_key(key: str, min_length: int = 10) -> Tuple[bool, Optional[str]]:
        if not key:
            return False, "API key is required"
        if len(key) < min_length:
            return False, f"API key must be at least {min_length} characters"
        if key.lower() in ['dummy', 'test', 'example']:
            return False, "Invalid placeholder API key detected"
        return True, None

    @staticmethod
    def validate_url(url: str, schemes: List[str] = ['http', 'https']) -> Tuple[bool, Optional[str]]:
        if not url:
            return False, "URL is required"
        try:
            result = urlparse(url)
            if result.scheme not in schemes:
                return False, f"URL scheme must be one of {schemes}"
            if not result.netloc:
                return False, "URL must include a host"
            return True, None
        except Exception as e:
            return False, f"Invalid URL format: {str(e)}"

    @staticmethod
    def validate_port(port: str) -> Tuple[bool, Optional[str]]:
        try:
            port_num = int(port)
            if port_num < 1 or port_num > 65535:
                return False, "Port must be between 1 and 65535"
            return True, None
        except ValueError:
            return False, "Port must be a valid integer"

    @staticmethod
    def validate_email(email: str) -> Tuple[bool, Optional[str]]:
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return False, "Invalid email format"
        return True, None

    @staticmethod
    def validate_enum(value: str, allowed_values: List[str]) -> Tuple[bool, Optional[str]]:
        if value not in allowed_values:
            return False, f"Value must be one of {allowed_values}"
        return True, None

def validate_environment(settings) -> None:
    validator = ConfigValidator()
    errors: Dict[str, List[str]] = {'critical': [], 'warnings': []}

    api_keys = {
        'GEMINI_API_KEY': getattr(settings, 'GEMINI_API_KEY', None),
        'BACKEND_API_KEY': getattr(settings, 'BACKEND_API_KEY', None),
    }
    for key_name, key_value in api_keys.items():
        valid, error = validator.validate_api_key(key_value, min_length=20)
        if not valid:
            errors['critical'].append(f"{key_name}: {error}")

    if hasattr(settings, 'BASE_URL') and settings.BASE_URL:
        valid, error = validator.validate_url(settings.BASE_URL)
        if not valid:
            errors['warnings'].append(f"BASE_URL: {error}")

    valid, error = validator.validate_enum(getattr(settings, 'ENV', 'development'), ['development', 'test', 'staging', 'production'])
    if not valid:
        errors['warnings'].append(f"ENV: {error}")

    if hasattr(settings, 'PORT') and settings.PORT:
        valid, error = validator.validate_port(str(settings.PORT))
        if not valid:
            errors['warnings'].append(f"PORT: {error}")

    valid, error = validator.validate_enum(getattr(settings, 'LOG_LEVEL', 'INFO').upper(), ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'])
    if not valid:
        errors['warnings'].append(f"LOG_LEVEL: {error}")

    if errors['critical']:
        error_msg = "❌ Critical configuration errors:\n"
        for err in errors['critical']:
            error_msg += f"  • {err}\n"
        error_msg += "\nApplication cannot start. Please fix these errors in your .env file."
        logger.error(error_msg)
        raise ValidationError(error_msg)

    if errors['warnings']:
        warning_msg = "⚠️  Configuration warnings:\n"
        for warn in errors['warnings']:
            warning_msg += f"  • {warn}\n"
        logger.warning(warning_msg)

    logger.info("✓ Environment validation passed")
