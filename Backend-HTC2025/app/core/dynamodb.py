import boto3
from app.config import settings


def get_dynamodb_resource():
    """
    Get a DynamoDB resource using boto3 with configuration from Settings.
    """
    session = boto3.Session(region_name=settings.aws_region)

    kwargs = {}
    if settings.dynamodb_endpoint_url:
        # Allows DynamoDB Local or custom endpoint
        kwargs["endpoint_url"] = settings.dynamodb_endpoint_url

    return session.resource("dynamodb", **kwargs)
