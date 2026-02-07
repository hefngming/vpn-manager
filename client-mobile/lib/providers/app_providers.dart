import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/api_service.dart';

// API 服务提供者
final apiServiceProvider = Provider((ref) => ApiService());

// 用户状态
final userProvider = StateNotifierProvider<UserNotifier, AsyncValue<User?>>((ref) {
  return UserNotifier(ref.read(apiServiceProvider));
});

class UserNotifier extends StateNotifier<AsyncValue<User?>> {
  final ApiService _apiService;
  
  UserNotifier(this._apiService) : super(const AsyncValue.data(null));

  Future<bool> login(String email, String password) async {
    state = const AsyncValue.loading();
    
    final result = await _apiService.login(email, password);
    
    if (result['success']) {
      // 登录成功后获取用户信息
      await loadUserData();
      return true;
    } else {
      state = AsyncValue.error(result['error'], StackTrace.current);
      return false;
    }
  }

  Future<bool> register(String email, String password) async {
    state = const AsyncValue.loading();
    
    final result = await _apiService.register(email, password);
    
    if (result['success']) {
      return true;
    } else {
      state = AsyncValue.error(result['error'], StackTrace.current);
      return false;
    }
  }

  Future<void> loadUserData() async {
    state = const AsyncValue.loading();
    
    final result = await _apiService.getNodes();
    
    if (result['success']) {
      state = AsyncValue.data(result['user']);
    } else {
      state = AsyncValue.error(result['error'], StackTrace.current);
    }
  }

  Future<void> logout() async {
    await _apiService.clearStorage();
    state = const AsyncValue.data(null);
  }

  Future<void> checkAuth() async {
    final token = await _apiService.getStoredToken();
    if (token != null) {
      await loadUserData();
    }
  }
}

// 节点列表状态
final nodesProvider = StateNotifierProvider<NodesNotifier, AsyncValue<List<Node>>>((ref) {
  return NodesNotifier(ref.read(apiServiceProvider));
});

class NodesNotifier extends StateNotifier<AsyncValue<List<Node>>> {
  final ApiService _apiService;
  
  NodesNotifier(this._apiService) : super(const AsyncValue.data([]));

  Future<void> loadNodes() async {
    state = const AsyncValue.loading();
    
    final result = await _apiService.getNodes();
    
    if (result['success']) {
      state = AsyncValue.data(result['nodes']);
    } else {
      state = AsyncValue.error(result['error'], StackTrace.current);
    }
  }
}

// VPN 连接状态
final vpnConnectionProvider = StateNotifierProvider<VPNConnectionNotifier, VPNConnectionState>((ref) {
  return VPNConnectionNotifier(ref.read(apiServiceProvider));
});

class VPNConnectionState {
  final bool isConnected;
  final bool isConnecting;
  final String? connectedNodeId;
  final String? error;
  final Duration connectionTime;

  VPNConnectionState({
    this.isConnected = false,
    this.isConnecting = false,
    this.connectedNodeId,
    this.error,
    this.connectionTime = Duration.zero,
  });

  VPNConnectionState copyWith({
    bool? isConnected,
    bool? isConnecting,
    String? connectedNodeId,
    String? error,
    Duration? connectionTime,
  }) {
    return VPNConnectionState(
      isConnected: isConnected ?? this.isConnected,
      isConnecting: isConnecting ?? this.isConnecting,
      connectedNodeId: connectedNodeId ?? this.connectedNodeId,
      error: error ?? this.error,
      connectionTime: connectionTime ?? this.connectionTime,
    );
  }
}

class VPNConnectionNotifier extends StateNotifier<VPNConnectionState> {
  final ApiService _apiService;
  
  VPNConnectionNotifier(this._apiService) : super(VPNConnectionState());

  Future<void> connect(String nodeId) async {
    state = state.copyWith(isConnecting: true, error: null);
    
    final result = await _apiService.connectNode(nodeId);
    
    if (result['success']) {
      // TODO: 启动 VPN 服务
      state = state.copyWith(
        isConnected: true,
        isConnecting: false,
        connectedNodeId: nodeId,
      );
    } else {
      state = state.copyWith(
        isConnecting: false,
        error: result['error'],
      );
    }
  }

  Future<void> disconnect() async {
    // TODO: 停止 VPN 服务
    state = VPNConnectionState();
  }

  void updateConnectionTime(Duration time) {
    state = state.copyWith(connectionTime: time);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}
