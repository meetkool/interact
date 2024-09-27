FROM python:3.12

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
CMD ["python", "app.py"]

ARG BUILD_VERSION
ENV APP_VERSION=$BUILD_VERSION