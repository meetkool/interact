from flask import Flask, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flasgger import Swagger

app = Flask(__name__)
limiter = Limiter(
      get_remote_address,app=app,default_limits=["100 per minute"]
)

swagger = Swagger(app)


@app.route('/', methods=['GET'])
@limiter.limit("100 per minute")
def hello_world():
      """
      Hello World endpoint
      ---
      responses:
        200:
          description: A greeting message
          schema:
            properties:
              message:
                type: string
                description: The greeting message
      """
      return jsonify({"message": "Hello, World!"})

@app.route('/health', methods=['GET'])
@limiter.limit("100 per minute")
def health_check():
      """
      Health Check endpoint
      ---
      responses:
        200:
          description: The health status
          schema:
            properties:
              status:
                type: string
                description: The status of the application
      """
      return jsonify({"status": "OK"})


@app.errorhandler(429)
def ratelimit_handler(e):
      """
      Rate Limit Error Handler
      ---
      responses:
        429:
          description: Rate limit exceeded
          schema:
            properties:
              error:
                type: string
                description: Error message
              description:
                type: string
                description: Detailed error description
      """
      return jsonify({"error": "Rate limit exceeded", "description": str(e.description)}), 429

if __name__ == '__main__':
      app.run(host='0.0.0.0', port=5000, debug=True)
