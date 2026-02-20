from rest_framework.pagination import LimitOffsetPagination

class DocumentLimitOffsetPagination(LimitOffsetPagination):
    default_limit = 15      
    max_limit = 100         
    limit_query_param = 'limit'
    offset_query_param = 'offset'
