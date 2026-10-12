#!/usr/bin/env python3
"""S3/R2 healthcheck — put/get/delete of healthcheck/live.txt. No secrets logged."""
import pathlib

def load_env(p=".env"):
    env={}
    for line in pathlib.Path(p).read_text(encoding="utf-8").splitlines():
        line=line.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        k,v=line.split("=",1)
        env[k.strip()]=v.strip()
    return env

def main():
    env=load_env()
    try:
        import boto3
        from botocore.config import Config
    except ImportError as e:
        print(f"S3 NOT_RUN: boto3 not installed ({e})")
        return 0
    ep=env.get("S3_ENDPOINT"); bucket=env.get("S3_BUCKET")
    ak=env.get("S3_ACCESS_KEY_ID"); sk=env.get("S3_SECRET_ACCESS_KEY")
    if not all([ep,bucket,ak,sk]):
        print("S3 NOT_RUN: env incomplete")
        return 0
    s3=boto3.client("s3", endpoint_url=ep, aws_access_key_id=ak, aws_secret_access_key=sk, region_name="auto", config=Config(signature_version="s3v4"))
    key="healthcheck/live.txt"
    s3.put_object(Bucket=bucket, Key=key, Body=b"healthcheck")
    data=s3.get_object(Bucket=bucket, Key=key)["Body"].read()
    assert data==b"healthcheck"
    s3.delete_object(Bucket=bucket, Key=key)
    print("S3 PASS: put/get/delete healthcheck/live.txt")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
