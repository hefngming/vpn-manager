import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'http://localhost:3000', // 生产环境需要改为真实域名
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  String? _token;

  void setToken(String token) {
    _token = token;
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  void clearToken() {
    _token = null;
    _dio.options.headers.remove('Authorization');
  }

  // 登录
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      
      if (response.data['token'] != null) {
        setToken(response.data['token']);
        // 保存到本地
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', response.data['token']);
      }
      
      return {'success': true, 'data': response.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data?['error'] ?? '登录失败',
      };
    }
  }

  // 注册
  Future<Map<String, dynamic>> register(String email, String password) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'email': email,
        'password': password,
      });
      
      return {'success': true, 'data': response.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data?['error'] ?? '注册失败',
      };
    }
  }

  // 获取节点列表
  Future<Map<String, dynamic>> getNodes() async {
    try {
      final response = await _dio.get('/api/client/nodes');
      
      final user = User.fromJson(response.data['user']);
      final nodes = (response.data['nodes'] as List)
          .map((n) => Node.fromJson(n))
          .toList();
      
      return {'success': true, 'user': user, 'nodes': nodes};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data?['error'] ?? '获取节点失败',
      };
    }
  }

  // 连接节点
  Future<Map<String, dynamic>> connectNode(String nodeId) async {
    try {
      final response = await _dio.post('/api/client/connect', data: {
        'nodeId': nodeId,
      });
      
      return {'success': true, 'data': response.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data?['error'] ?? '连接失败',
      };
    }
  }

  // 检查本地存储的 token
  Future<String?> getStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token != null) {
      setToken(token);
    }
    return token;
  }

  // 清除本地存储
  Future<void> clearStorage() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    clearToken();
  }
}
