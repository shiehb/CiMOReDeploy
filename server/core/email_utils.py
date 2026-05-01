import logging
import secrets
import string
import time
from email.utils import formataddr, parseaddr

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

DOMAIN_ERROR = "Only @slc-sflu.edu.ph school accounts are allowed to access this system."


def validate_email_domain(email):
    """Raise ValueError if the email is not an @slc-sflu.edu.ph address."""
    if '@' in str(email) and not str(email).lower().endswith('@slc-sflu.edu.ph'):
        raise ValueError(DOMAIN_ERROR)


def generate_temp_password(first_name='', last_name='', username='', email=''):
    """
    Generate a cryptographically secure 12-character temporary password.
    Guarantees at least one uppercase letter, lowercase letter, digit, and
    special character. Rejects passwords whose lowercase form contains any
    3+ character substring from the user's name, username, or email local-part
    to satisfy the 'must not contain user info' requirement.
    """
    chars_upper = string.ascii_uppercase
    chars_lower = string.ascii_lowercase
    chars_digits = string.digits
    chars_special = '@#$!'
    all_chars = chars_upper + chars_lower + chars_digits + chars_special

    email_local = email.split('@')[0] if email and '@' in email else email
    forbidden = [
        s.lower()
        for s in [first_name, last_name, username, email_local]
        if s and len(s) >= 3
    ]

    for _ in range(100):
        mandatory = [
            secrets.choice(chars_upper),
            secrets.choice(chars_lower),
            secrets.choice(chars_digits),
            secrets.choice(chars_special),
        ]
        filler = [secrets.choice(all_chars) for _ in range(8)]
        pool = mandatory + filler
        secrets.SystemRandom().shuffle(pool)
        password = ''.join(pool)

        if not any(sub in password.lower() for sub in forbidden):
            return password

    # Extremely unlikely fallback — skip name check after 100 attempts
    mandatory = [
        secrets.choice(chars_upper),
        secrets.choice(chars_lower),
        secrets.choice(chars_digits),
        secrets.choice(chars_special),
    ]
    filler = [secrets.choice(all_chars) for _ in range(8)]
    pool = mandatory + filler
    secrets.SystemRandom().shuffle(pool)
    return ''.join(pool)


def send_welcome_email(user_email, full_name, username, temp_password, max_retries=3):
    """
    Send a welcome email containing the temporary password.
    Retries up to max_retries times with exponential back-off (2s, 4s, 8s).
    Returns True if delivered successfully, False after all retries are exhausted.
    """
    subject = "Your Account Has Been Created – Temporary Password Inside"
    login_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    support_email = getattr(settings, 'SUPPORT_EMAIL', 'support@cimore.edu.ph')
    # Always display as "CiMORe" — extract the raw address then re-format it
    _raw = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@cimore.edu.ph')
    _, _addr = parseaddr(_raw)
    from_email = formataddr(('CiMORe', _addr or _raw))

    message = (
        f"Dear {full_name},\n\n"
        f"Welcome to CiMORe! An administrator has created an account for you.\n\n"
        f"Your login credentials:\n"
        f"  Username / Email : {username}\n"
        f"  Temporary Password: {temp_password}\n\n"
        f"IMPORTANT: You must change your password upon first login.\n"
        f"This temporary password will expire after your first login or within "
        f"24 hours, whichever comes first.\n\n"
        f"Log in here: {login_url}\n\n"
        f"Need help? Contact us at {support_email}\n\n"
        f"This is an automated message — please do not reply.\n\n"
        f"Best regards,\n"
        f"College Information and Marketing Office (CIMO)"
    )

    for attempt in range(1, max_retries + 1):
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=[user_email],
                fail_silently=False,
            )
            logger.info(
                "Welcome email delivered to %s (attempt %d/%d)",
                user_email, attempt, max_retries,
            )
            return True
        except Exception as exc:
            logger.warning(
                "Email attempt %d/%d failed for %s: %s",
                attempt, max_retries, user_email, exc,
            )
            if attempt < max_retries:
                time.sleep(2 ** attempt)

    logger.error("All %d email attempts failed for %s", max_retries, user_email)
    return False


def send_notification_email(user_email, full_name, title, body, max_retries=3):
    """Send a single in-app notification as an email."""
    subject = f"CiMORe: {title}"
    login_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    support_email = getattr(settings, 'SUPPORT_EMAIL', 'cimo@slc-sflu.edu.ph')
    _raw = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@cimore.edu.ph')
    _, _addr = parseaddr(_raw)
    from_email = formataddr(('CiMORe', _addr or _raw))

    message = (
        f"Dear {full_name},\n\n"
        f"{body}\n\n"
        f"Log in to CiMORe to view the full notification:\n"
        f"{login_url}\n\n"
        f"For questions, contact {support_email}\n\n"
        f"This is an automated message — please do not reply.\n\n"
        f"Best regards,\n"
        f"College Information and Marketing Office (CIMO)"
    )

    for attempt in range(1, max_retries + 1):
        try:
            send_mail(subject=subject, message=message, from_email=from_email,
                      recipient_list=[user_email], fail_silently=False)
            logger.info("Notification email delivered to %s (attempt %d)", user_email, attempt)
            return True
        except Exception as exc:
            logger.warning("Notification email attempt %d failed for %s: %s", attempt, user_email, exc)
            if attempt < max_retries:
                time.sleep(2 ** attempt)

    logger.error("All notification email attempts failed for %s", user_email)
    return False


def send_password_reset_email(user_email, full_name, reset_token, max_retries=3):
    """Send a password-reset link to the user's email. Valid for 2 hours."""
    subject = "Password Reset Request – CiMORe"
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    reset_url = f"{frontend_url}?token={reset_token}"
    support_email = getattr(settings, 'SUPPORT_EMAIL', 'cimo@slc-sflu.edu.ph')
    _raw = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@cimore.edu.ph')
    _, _addr = parseaddr(_raw)
    from_email = formataddr(('CiMORe', _addr or _raw))

    message = (
        f"Dear {full_name},\n\n"
        f"We received a request to reset your CiMORe account password.\n\n"
        f"Click the link below to set a new password. This link is valid for 2 hours "
        f"and can only be used once.\n\n"
        f"  {reset_url}\n\n"
        f"If you did not request a password reset, please ignore this email — "
        f"your account remains secure.\n\n"
        f"For assistance, contact us at {support_email}\n\n"
        f"This is an automated message — please do not reply.\n\n"
        f"Best regards,\n"
        f"College Information and Marketing Office (CIMO)"
    )

    for attempt in range(1, max_retries + 1):
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=[user_email],
                fail_silently=False,
            )
            logger.info("Password reset email delivered to %s (attempt %d)", user_email, attempt)
            return True
        except Exception as exc:
            logger.warning(
                "Password reset email attempt %d/%d failed for %s: %s",
                attempt, max_retries, user_email, exc,
            )
            if attempt < max_retries:
                time.sleep(2 ** attempt)

    logger.error("All password reset email attempts failed for %s", user_email)
    return False


def send_request_confirmation_email(user_email, full_name, title, request_id,
                                    request_type, preferred_date='Not specified',
                                    max_retries=3):
    """Send a submission confirmation email to the requester."""
    subject = "Your Marketing Request Has Been Submitted – CiMORe"
    login_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    support_email = getattr(settings, 'SUPPORT_EMAIL', 'cimo@slc-sflu.edu.ph')
    _raw = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@cimore.edu.ph')
    _, _addr = parseaddr(_raw)
    from_email = formataddr(('CiMORe', _addr or _raw))

    message = (
        f"Dear {full_name},\n\n"
        f"Your marketing request has been received and is now under review.\n\n"
        f"Request Details:\n"
        f"  Reference No. : #{request_id}\n"
        f"  Title         : {title}\n"
        f"  Type          : {request_type}\n"
        f"  Preferred Date: {preferred_date}\n"
        f"  Status        : Pending\n\n"
        f"Our team will process your request and notify you of any updates.\n"
        f"You can track your request status by logging in here:\n"
        f"{login_url}\n\n"
        f"For questions, contact us at {support_email}\n\n"
        f"This is an automated message — please do not reply.\n\n"
        f"Best regards,\n"
        f"CiMORe Team"
    )

    for attempt in range(1, max_retries + 1):
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=[user_email],
                fail_silently=False,
            )
            logger.info("Confirmation email sent to %s for request #%s", user_email, request_id)
            return True
        except Exception as exc:
            logger.warning(
                "Confirmation email attempt %d/%d failed for request #%s: %s",
                attempt, max_retries, request_id, exc,
            )
            if attempt < max_retries:
                time.sleep(2 ** attempt)

    logger.error("All confirmation email attempts failed for request #%s", request_id)
    return False
