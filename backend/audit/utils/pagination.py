from rest_framework.pagination import LimitOffsetPagination

class AuditLimitOffsetPagination(LimitOffsetPagination):
    default_limit = 15      
    max_limit = 1000         
    limit_query_param = 'limit'
    offset_query_param = 'offset'