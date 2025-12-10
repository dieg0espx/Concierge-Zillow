'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Send,
  Eye,
  ExternalLink,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
} from 'lucide-react'
import { Invoice, InvoiceStatus, deleteInvoice, sendInvoice } from '@/lib/actions/invoices'
import { formatCurrency } from '@/lib/utils'

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Mail },
  viewed: { label: 'Viewed', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Eye },
  paid: { label: 'Paid', color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: AlertCircle },
}

export function InvoicesList({ invoices }: { invoices: Invoice[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.client_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async () => {
    if (!selectedInvoice) return
    setIsDeleting(true)

    const result = await deleteInvoice(selectedInvoice.id)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Invoice deleted',
        description: `Invoice ${selectedInvoice.invoice_number} has been deleted.`,
      })
      router.refresh()
    }

    setIsDeleting(false)
    setDeleteDialogOpen(false)
    setSelectedInvoice(null)
  }

  const handleSend = async () => {
    if (!selectedInvoice) return
    setIsSending(true)

    const result = await sendInvoice(selectedInvoice.id)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Invoice sent',
        description: `Invoice ${selectedInvoice.invoice_number} has been sent to ${selectedInvoice.client_email}.`,
      })
      router.refresh()
    }

    setIsSending(false)
    setSendDialogOpen(false)
    setSelectedInvoice(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
          />
        </div>
        <Link href="/admin/invoices/new">
          <Button className="btn-luxury">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Invoice Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {(['draft', 'sent', 'viewed', 'paid', 'overdue'] as InvoiceStatus[]).map((status) => {
          const config = statusConfig[status]
          const count = invoices.filter(inv => inv.status === status).length
          const Icon = config.icon
          return (
            <Card key={status} className="glass-card-accent border-white/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-xs text-white/60 uppercase tracking-wider">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Invoices Table */}
      <Card className="glass-card-accent border-white/10 overflow-hidden">
        <CardContent className="p-0">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No invoices found</h3>
              <p className="text-white/60 mb-4">
                {searchTerm ? 'Try a different search term' : 'Create your first invoice to get started'}
              </p>
              {!searchTerm && (
                <Link href="/admin/invoices/new">
                  <Button className="btn-luxury">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70">Invoice #</TableHead>
                  <TableHead className="text-white/70">Client</TableHead>
                  <TableHead className="text-white/70 text-right">Amount</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-white/70">Due Date</TableHead>
                  <TableHead className="text-white/70 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const config = statusConfig[invoice.status]
                  const Icon = config.icon
                  const isOverdue = invoice.status === 'overdue' ||
                    ((invoice.status === 'sent' || invoice.status === 'viewed') && new Date(invoice.due_date) < new Date())

                  return (
                    <TableRow key={invoice.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-mono text-white">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{invoice.client_name}</p>
                          <p className="text-sm text-white/60">{invoice.client_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-white">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${config.color} border`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className={isOverdue ? 'text-red-400' : 'text-white/70'}>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(invoice.due_date)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.status === 'draft' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedInvoice(invoice)
                                  setSendDialogOpen(true)
                                }}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Link href={`/admin/invoices/${invoice.id}/edit`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white/70 hover:text-white hover:bg-white/10"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedInvoice(invoice)
                                  setDeleteDialogOpen(true)
                                }}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {invoice.status !== 'draft' && (
                            <Link href={`/invoice/${invoice.invoice_number}`} target="_blank">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/70 hover:text-white hover:bg-white/10"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card-accent border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete invoice {selectedInvoice?.invoice_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <AlertDialogContent className="glass-card-accent border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Send Invoice</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Send invoice {selectedInvoice?.invoice_number} to {selectedInvoice?.client_email}?
              The client will receive a link to view and pay the invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSend}
              disabled={isSending}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isSending ? 'Sending...' : 'Send Invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
