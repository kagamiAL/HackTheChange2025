import boto3
from app.config import Config


def get_dynamodb_resource():
    """
    Get a DynamoDB resource using boto3 with configuration from Config.
    """
    session = boto3.Session(region_name=Config.aws_region)

    kwargs = {}
    if Config.dynamodb_endpoint_url:
        # Allows DynamoDB Local or custom endpoint
        kwargs["endpoint_url"] = Config.dynamodb_endpoint_url

    return session.resource("dynamodb", **kwargs)
